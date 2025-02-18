import chai, { expect } from 'chai';
import path from 'path';

import Helper from '../../src/e2e-helper/e2e-helper';

chai.use(require('chai-fs'));

describe('repository-hooks', function () {
  let exportOutput;
  let importOutput;
  this.timeout(0);
  let helper: Helper;
  before(() => {
    helper = new Helper();
  });
  after(() => {
    helper.scopeHelper.destroy();
  });
  describe('export to remote scope with manipulation hook', () => {
    before(() => {
      helper.scopeHelper.setNewLocalAndRemoteScopesHarmony();
      helper.bitJsonc.setupDefault();
      helper.fixtures.copyFixtureFile(
        path.join('scopes', 'repository-hooks-fixture.js'),
        'repository-hooks.js',
        helper.scopes.remotePath
      );
      helper.scopeJson.addKeyVal('hooksPath', './repository-hooks.js', helper.scopes.remotePath);
      helper.fixtures.createComponentBarFoo();
      helper.fixtures.addComponentBarFooAsDir();
      helper.fixtures.tagComponentBarFoo();
      exportOutput = helper.command.export();
      helper.scopeHelper.reInitLocalScopeHarmony();
      helper.scopeHelper.addRemoteScope();
    });
    it('should run the on persist hook', () => {
      const regex = new RegExp('on persist run', 'g');
      const count = exportOutput.match(regex);
      // 3 objects - component, version and file
      expect(count).to.have.lengthOf(3);
    });

    describe('import from remote scope with manipulation hook', () => {
      before(() => {
        importOutput = helper.command.importComponent('bar/foo');
      });
      it('should run the on read hook', () => {
        const regex = new RegExp('on read run', 'g');
        const count = importOutput.match(regex);
        // total 3 objects - component, version and file
        // The read happen twice. via repository.load (component, version),
        // and via repository.loadRaw (component, version, file). total 5 reads.
        // TODO: check why we read them twice.. it create performance issue
        // TODO2: on Harmony it became 8 instead of 5. why?
        expect(count).to.have.lengthOf(8);
      });
      it('should be able to import the component as usual', () => {
        expect(importOutput).to.have.string('successfully imported one component');
      });
    });
  });
});
