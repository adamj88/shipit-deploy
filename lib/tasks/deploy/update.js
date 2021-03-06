'use strict';

exports.__esModule = true;

var _shipitUtils = require('shipit-utils');

var _shipitUtils2 = _interopRequireDefault(_shipitUtils);

var _posix = require('path2/posix');

var _posix2 = _interopRequireDefault(_posix);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _rmfr = require('rmfr');

var _rmfr2 = _interopRequireDefault(_rmfr);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _extendShipit = require('../../extendShipit');

var _extendShipit2 = _interopRequireDefault(_extendShipit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * Update task.
 * - Set previous release.
 * - Set previous revision.
 * - Create and define release path.
 * - Copy previous release (for faster rsync)
 * - Set current revision and write REVISION file.
 * - Remote copy project.
 * - Remove workspace.
 */
const updateTask = shipit => {
  _shipitUtils2.default.registerTask(shipit, 'deploy:update', _asyncToGenerator(function* () {

    /**
     * Copy previous release to release dir.
     */

    let copyPreviousRelease = (() => {
      var _ref2 = _asyncToGenerator(function* () {
        const copyParameter = shipit.config.copy || '-a';
        if (!shipit.previousRelease || shipit.config.copy === false) return;
        shipit.log('Copy previous release to "%s"', shipit.releasePath);
        yield shipit.remote(_util2.default.format('cp %s %s/. %s', copyParameter, _posix2.default.join(shipit.releasesPath, shipit.previousRelease), shipit.releasePath));
      });

      return function copyPreviousRelease() {
        return _ref2.apply(this, arguments);
      };
    })();

    /**
     * Create and define release path.
     */


    let createReleasePath = (() => {
      var _ref3 = _asyncToGenerator(function* () {
        /* eslint-disable no-param-reassign */
        shipit.releaseDirname = _moment2.default.utc().format('YYYYMMDDHHmmss');
        shipit.releasePath = _posix2.default.join(shipit.releasesPath, shipit.releaseDirname);
        /* eslint-enable no-param-reassign */

        shipit.log('Create release path "%s"', shipit.releasePath);
        yield shipit.remote(`mkdir -p ${shipit.releasePath}`);
        shipit.log(_chalk2.default.green('Release path created.'));
      });

      return function createReleasePath() {
        return _ref3.apply(this, arguments);
      };
    })();

    /**
     * Remote copy project.
     */

    let remoteCopy = (() => {
      var _ref4 = _asyncToGenerator(function* () {
        const options = _lodash2.default.get(shipit.config, 'deploy.remoteCopy') || {
          rsync: '--del'
        };
        const rsyncFrom = shipit.config.rsyncFrom || shipit.config.workspace;
        const uploadDirPath = _posix2.default.resolve(rsyncFrom, shipit.config.dirToCopy || '');

        shipit.log('Copy project to remote servers.');

        yield shipit.remoteCopy(`${uploadDirPath}/`, shipit.releasePath, options);
        shipit.log(_chalk2.default.green('Finished copy.'));
      });

      return function remoteCopy() {
        return _ref4.apply(this, arguments);
      };
    })();

    /**
     * Set shipit.previousRevision from remote REVISION file.
     */


    let setPreviousRevision = (() => {
      var _ref5 = _asyncToGenerator(function* () {
        /* eslint-disable no-param-reassign */
        shipit.previousRevision = null;
        /* eslint-enable no-param-reassign */

        if (!shipit.previousRelease) return;

        const revision = yield shipit.getRevision(shipit.previousRelease);
        if (revision) {
          shipit.log(_chalk2.default.green('Previous revision found.'));
          /* eslint-disable no-param-reassign */
          shipit.previousRevision = revision;
          /* eslint-enable no-param-reassign */
        }
      });

      return function setPreviousRevision() {
        return _ref5.apply(this, arguments);
      };
    })();

    /**
     * Set shipit.previousRelease.
     */


    let setPreviousRelease = (() => {
      var _ref6 = _asyncToGenerator(function* () {
        /* eslint-disable no-param-reassign */
        shipit.previousRelease = null;
        /* eslint-enable no-param-reassign */
        const currentReleaseDirname = yield shipit.getCurrentReleaseDirname();
        if (currentReleaseDirname) {
          shipit.log(_chalk2.default.green('Previous release found.'));
          /* eslint-disable no-param-reassign */
          shipit.previousRelease = currentReleaseDirname;
          /* eslint-enable no-param-reassign */
        }
      });

      return function setPreviousRelease() {
        return _ref6.apply(this, arguments);
      };
    })();

    /**
     * Set shipit.currentRevision and write it to REVISION file.
     */


    let setCurrentRevision = (() => {
      var _ref7 = _asyncToGenerator(function* () {
        shipit.log('Setting current revision and creating revision file.');

        if(process.env.CI_COMMIT_SHA) {
          /* eslint-disable no-param-reassign */
          shipit.currentRevision = process.env.CI_COMMIT_SHA;
          /* eslint-enable no-param-reassign */
        } else {
          const response = yield shipit.local(`git rev-parse ${shipit.config.branch}`, {
            cwd: shipit.workspace
          });

          /* eslint-disable no-param-reassign */
          shipit.currentRevision = response.stdout.trim();
          /* eslint-enable no-param-reassign */
        }

        yield shipit.remote(`echo "${shipit.currentRevision}" > ${_posix2.default.join(shipit.releasePath, 'REVISION')}`);
        shipit.log(_chalk2.default.green('Revision file created.'));
      });

      return function setCurrentRevision() {
        return _ref7.apply(this, arguments);
      };
    })();

    let removeWorkspace = (() => {
      var _ref8 = _asyncToGenerator(function* () {
      	if (shipit.config.shallowClone) {
        shipit.log(`Removing workspace "${shipit.workspace}"`);
        yield (0, _rmfr2.default)(shipit.workspace);
        shipit.log(_chalk2.default.green('Workspace removed.'));
    	}
      });

      return function removeWorkspace() {
        return _ref8.apply(this, arguments);
      };
    })();

    (0, _extendShipit2.default)(shipit);

    yield setPreviousRelease();
    yield setPreviousRevision();
    yield createReleasePath();
    yield copyPreviousRelease();
    yield remoteCopy();
    yield setCurrentRevision();
    yield removeWorkspace();
    shipit.emit('updated');
  }));
};

exports.default = updateTask;
