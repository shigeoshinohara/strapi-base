module.exports = () => ({
  // 'my-upload-2': {
  //   enabled: true,
  //   resolve: './src/plugins/my-upload-2'
  // },
  // 'my-upload': {
  //   enabled: true,
  //   resolve: './src/plugins/my-upload'
  // },
   upload: {
    enabled: true, // これで無効化
     config: {
       // プラグイン固有の設定
       // 例: プロバイダーの設定、サイズ制限など
     },
  },
});
