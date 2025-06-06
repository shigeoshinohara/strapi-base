import pluginId from './pluginId';

const name = 'upload-admin-extension';

console.log(`${name} が読み込まれました`);

export default {
  register(app) {
    console.log(`${name}: アップロードプラグインの管理画面 UI 拡張が登録されました`);

    // 最小限のオーバーライド
    app.registerPlugin({
      id: pluginId,
      name,
    });
  },

  bootstrap(app) {
    console.log(`${name}: アップロードプラグインの管理画面 UI 拡張が起動しました`);
  }
};
