import pluginId from './pluginId';
import CustomMediaLibraryCard from './components/MediaLibraryCard';

const name = 'upload-admin-extension';

console.log(`${name} が読み込まれました`);

export default {
  register(app) {
    console.log(`${name}: アップロードプラグインの管理画面 UI 拡張が登録されました`);

    try {
      // コンポーネントをオーバーライド
      app.overridePlugin(pluginId, {
        components: {
          MediaLibraryCard: CustomMediaLibraryCard,
        },
      });

      console.log('コンポーネントオーバーライド成功');
    } catch (error) {
      console.error('コンポーネントオーバーライドエラー:', error);
    }
  },

  bootstrap(app) {
    console.log(`${name}: アップロードプラグインの管理画面 UI 拡張が起動しました`);
  }
};
