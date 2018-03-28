'use strict';

const mock = require('egg-mock');

describe('test/file-upload.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/file-upload-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, fileUpload')
      .expect(200);
  });
});
