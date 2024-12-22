import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { BlockService } from '@/chat/services/block.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { Injectable } from '@nestjs/common';

import SETTINGS from './settings';

@Injectable()
export class CurrentTimePlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    // default trigger for you custom block
    patterns: ['time'],
    // if set to true then your block comes as entrypoint by default
    starts_conversation: true,
    // displayed name for your plugin
    name: 'Current Time Plugin',
  };

  constructor(
    pluginService: PluginService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('currenttime-plugin', pluginService);
  }

  getPath(): string {
    return __dirname;
  }

  async process(
    block: Block,
    context: Context,
    _convId: string,
  ): Promise<StdOutgoingEnvelope> {
    const settings = await this.settingService.getSettings();
    const args = this.getArguments(block);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour12: false });

    /**
     * getRandom() function will pick randomly a string from response_message value
     * array defined in the settings file to build the response.
     */
    const response: string =
      this.blockService.getRandom([...args.response_message]) +
      ' ⌚ ' +
      formattedTime;

    /**
     * returned response from your custom block when triggering it, in this example
     * it returns a text message displaying time now.
     */
    const msg: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: this.blockService.processText(response, context, {}, settings),
      },
    };

    return msg;
  }
}
