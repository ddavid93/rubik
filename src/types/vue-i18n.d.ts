declare module 'vue-i18n' {
  export const createI18n: any;
  export const useI18n: any;
  const _default: any;
  export default _default;
}

import 'vue';
declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string, values?: Record<string, any>) => string;
  }
}
