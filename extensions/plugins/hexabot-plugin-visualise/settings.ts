import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'message',
    group: 'default',
    type: SettingType.text,
    value: 'Please provide a CSV file for visualization', // Default message or instruction
  },
  {
    label: 'csv_file_path',
    group: 'input',
    type: SettingType.text,
    value: '', // Default value is empty, expecting the user to provide a file path
  },
  {
    label: 'visualization_type',
    group: 'options',
    type: SettingType.select,
    options: ['line', 'bar', 'pie'], // Available types of visualization
    value: 'line', // Default visualization type
  },
] as const satisfies PluginSetting[];
