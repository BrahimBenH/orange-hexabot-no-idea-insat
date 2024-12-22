import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  PayloadType,
  StdOutgoingAttachmentEnvelope,
  StdOutgoingEnvelope,
} from '@/chat/schemas/types/message';
import { BlockService } from '@/chat/services/block.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { Injectable } from '@nestjs/common';

import SETTINGS from './settings';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { FileType } from '@/chat/schemas/types/attachment';
import { Payload } from '@/chat/schemas/types/quick-reply';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VisualisationPlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    patterns: ['visualize'],
    starts_conversation: true,
    name: 'Visualization Plugin',
  };

  constructor(
    pluginService: PluginService,
    private readonly attachmentService: AttachmentService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('visualisation-plugin', pluginService);
  }

  getPath(): string {
    return __dirname;
  }

  async process(
    block: Block,
    context: Context,
    _convId: string,
  ): Promise<StdOutgoingEnvelope> {
    const attachment = context.payload as Payload;
    const url =
      attachment.type === PayloadType.attachments &&
      attachment.attachments.payload.url.replace('4000', '3000');

    console.log('----------------');
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 seconds
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const fileBuffer = Buffer.from(res.data);

    try {
      console.log('GETTING STARTED ');

      // Generate visualization from the CSV file buffer
      const visualizationBuffer = await this.generateVisualization(fileBuffer);
      console.log('generateVisualization ');

      const timestamp = Date.now();

      // Generate a unique filename for the image
      const imageFileName = `visualization-${uuidv4()}-${timestamp}}.png`;

      // Create an attachment object without saving the file locally
      const uploadedFile = await this.attachmentService.create({
        size: visualizationBuffer.length,
        type: 'image/png',
        name: imageFileName,
        channel: {},

        location: imageFileName, // No local file path
      });
      console.log('attachmentService.create ');

      // Prepare the envelope to send the image buffer to the user
      const envelope: StdOutgoingAttachmentEnvelope = {
        format: OutgoingMessageFormat.attachment,
        message: {
          attachment: {
            type: FileType.image,
            payload: {
              ...uploadedFile,
              url: Attachment.getAttachmentUrl(
                uploadedFile.id,
                uploadedFile.name,
              ),
            },
          },
        },
      };

      return envelope;
    } catch (error) {
      console.error('Error generating visualization:', error);

      const errorEnvelope: StdOutgoingEnvelope = {
        format: OutgoingMessageFormat.text,
        message: {
          text: 'There was an error generating the visualization.',
        },
      };

      return errorEnvelope;
    }
  }

  // Generate the visualization by sending the CSV file buffer to the Flask server
  private async generateVisualization(csvBuffer: Buffer): Promise<Buffer> {
    const pythonServiceUrl = 'http://flask:8045/visualize'; // Flask server URL
    console.log(1);
    // Create FormData to send the buffer to Flask
    const formData = new FormData();
    console.log(2);
    formData.append('file', csvBuffer, {
      filename: 'temp.csv',
      contentType: 'text/csv',
    });
    console.log(3);
    try {
      // Send the POST request to Flask server
      const response = await axios.post(pythonServiceUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer', // Expecting image data as a response
      });

      console.log(response.data);
      console.log(4);

      // Return the image buffer received from Flask
      return response.data;
    } catch (error) {
      console.error('Error in connecting to Flask service:', error);
      throw new Error('Error generating visualization from Flask.');
    }
  }
}
