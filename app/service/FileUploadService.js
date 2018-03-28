'use strict';

const Service = require('egg').Service;
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const uuid = require('uuid');
const awaitWriteStream = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');
const send = require('koa-send');

class FileUploadService extends Service {

  async upload(opts) {
    const ctx = this.ctx;
    const { logger } = ctx;

    const uploadOpts = Object.assign({}, this.config.fileUpload, opts);
    const { uploadDir, uploadFileName } = uploadOpts;

    logger.info(`start to upload file to ${uploadDir}`);

    const stream = await ctx.getFileStream();
    mkdirp.sync(uploadDir);

    const originalFileName = path.basename(stream.filename);
    const originalFileExtName = path.extname(originalFileName);

    let fileName;
    if (typeof uploadFileName === 'string') {
      fileName = uploadFileName;
    } else if (typeof uploadFileName === 'function') {
      fileName = uploadFileName(originalFileName, uploadOpts, ctx);
    } else {
      fileName = originalFileName;
    }

    fileName = fileName || uuid() + originalFileExtName;

    logger.info(`upload file name is ${fileName}`);

    const writeStream = fs.createWriteStream(path.join(uploadDir, fileName));

    try {
      await awaitWriteStream(stream.pipe(writeStream));
    } catch (err) {
      await sendToWormhole(stream);
      throw err;
    }

    ctx.formatSuccessResp({
      fileName,
    });

    logger.info(`complete to upload file to ${fileName}`);
  }

  async download(opts) {
    const ctx = this.ctx;
    const { logger } = ctx;

    const downloadOpts = Object.assign({}, this.config.fileUpload, opts);
    const { downloadDir, downLoadFileName } = downloadOpts;

    let fileName;
    if (typeof downLoadFileName === 'string') {
      fileName = downLoadFileName;
    } else if (typeof downLoadFileName === 'function') {
      fileName = downLoadFileName(downloadOpts, ctx);
    }

    fileName = fileName || path.basename(ctx.path);

    logger.info(`start to download file ${fileName}`);

    ctx.attachment(fileName);

    await send(ctx, fileName, { root: downloadDir });

    logger.info(`complete to download file to ${fileName}`);
  }
}

module.exports = FileUploadService;
