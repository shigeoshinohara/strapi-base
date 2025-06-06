'use strict';

module.exports = (plugin) => {
  console.log('アップロードプラグイン拡張が読み込まれました');

  // プラグインの構造を確認
  console.log('プラグイン構造:', {
    hasControllers: !!plugin.controllers,
    hasServices: !!plugin.services,
    hasRoutes: !!plugin.routes
  });

  // すべてのメソッドをラップするシンプルな実装
  if (plugin.controllers) {
    Object.keys(plugin.controllers).forEach(controllerName => {
      const controller = plugin.controllers[controllerName];

      if (controller && typeof controller === 'object') {
        Object.keys(controller).forEach(methodName => {
          const originalMethod = controller[methodName];

          if (typeof originalMethod === 'function') {
            controller[methodName] = async (ctx) => {
              console.log(`拡張メソッド実行: ${controllerName}.${methodName}`);
              return await originalMethod(ctx);
            };
          }
        });
      }
    });
  }

  return plugin;
};
