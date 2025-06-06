'use strict';

module.exports = (plugin) => {
  // プラグイン構造のデバッグ
  console.log('プラグイン構造:', {
    controllers: Object.keys(plugin.controllers || {}),
    services: Object.keys(plugin.services || {}),
    routes: plugin.routes ? 'あり' : 'なし',
    config: plugin.config ? 'あり' : 'なし'
  });

  // コントローラーの詳細構造を表示（もし存在すれば）
  if (plugin.controllers) {
    Object.keys(plugin.controllers).forEach(controllerName => {
      console.log(`コントローラー [${controllerName}] のメソッド:`,
        Object.keys(plugin.controllers[controllerName] || {})
      );
    });
  }

  // すべてのルートをログ出力
  if (plugin.routes) {
    console.log('利用可能なルート:',
      plugin.routes.map(route => `${route.method} ${route.path} -> ${route.handler}`)
    );
  }

  return plugin;
};
