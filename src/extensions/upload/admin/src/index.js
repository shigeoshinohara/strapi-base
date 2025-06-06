import pluginId from './pluginId';
import CustomMediaLibraryCard from './components/MediaLibraryCard';

const name = 'upload-admin-extension';

console.log(`${name} が読み込まれました`);

export default {
  register(app) {
    console.log(`${name}: アップロードプラグインの管理画面 UI 拡張が登録されました`);

    try {
      // プラグインの登録
      app.registerPlugin({
        id: pluginId,
        isReady: true,
        components: {
          MediaLibraryCard: CustomMediaLibraryCard,
        },
      });

      console.log('プラグイン登録成功');
    } catch (error) {
      console.error('プラグイン登録エラー:', error);
    }
  },

  bootstrap(app) {
    console.log(`${name}: アップロードプラグインの管理画面 UI 拡張が起動しました`);
  }
};
