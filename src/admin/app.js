// import './app.css';
console.log("TEST OVERRIDE APP.JS");
export default {
  config: {
    locales: ["en"],
  },
  bootstrap() {
    console.log("BOOTSTRAP OVERRIDE TEST");
  },
  register(app) {
    // "upload" プラグインのメニューを非表示にする
    app.customFields.unregister('plugin::upload.default');
    app.menu.removeLink('plugin::upload');
  },
};
