import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

// メディアライブラリページをカスタマイズしたコンポーネント
import MediaLibrary from './components/MediaLibrary';

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'カスタムメディアライブラリ',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
    });

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name: pluginId,
    });
  },

  bootstrap(app) {
    // MediaLibraryページのオーバーライド
    app.overrideComponent('upload', 'MediaLibrary', MediaLibrary);
  },
};
