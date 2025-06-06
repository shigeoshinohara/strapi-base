// import './app.css';
import uploadPluginId from '../extensions/upload/admin/src/pluginId';
import CustomMediaLibraryCard from '../extensions/upload/admin/src/components/MediaLibraryCard';
console.log("TEST OVERRIDE APP.JS");
export default {
  config: {
    locales: ["en"],
  },
  bootstrap(app) {
    console.log('カスタム管理画面の初期化 - src/admin/app.js');

    // 拡張機能のログ出力テスト
    console.log('アップロードプラグイン拡張の初期化を試みます');

    try {
      // プラグインをオーバーライド
      app.overridePlugin(uploadPluginId, {
        components: {
          MediaLibraryCard: CustomMediaLibraryCard,
        },
      });
      console.log('アップロードプラグインのオーバーライド成功');
    } catch (error) {
      console.error('アップロードプラグインのオーバーライドエラー:', error);
    }
  },
  register(app) {
    // "upload" プラグインのメニューを非表示にする
    app.customFields.unregister('plugin::upload.default');
    app.menu.removeLink('plugin::upload');
  },
};
