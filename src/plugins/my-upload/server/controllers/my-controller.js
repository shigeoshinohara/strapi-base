'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('my-upload')
      .service('myService')
      .getWelcomeMessage();
  },
});
