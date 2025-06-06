'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/*{ strapi }*/) {
    console.log('アプリケーション初期化前: プラグイン登録フェーズ');
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  bootstrap({ strapi }) {
    console.log('アプリケーション起動中: ブートストラップフェーズ');
    console.log('登録済みプラグイン:', Object.keys(strapi.plugins || {}));

    // アップロードプラグインが登録されているか確認
    if (strapi.plugins.upload) {
      console.log('アップロードプラグインが登録されています');
    } else {
      console.log('警告: アップロードプラグインが見つかりません');
    }
  },
};
