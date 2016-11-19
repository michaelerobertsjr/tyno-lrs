import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import app from '../src/App';
import * as xapi from '../src/xapi/Wrapper';
// var xAPIWrapper = require('../src/xapi/Wrapper');

chai.use(chaiHttp);
const expect = chai.expect;
describe('xAPI tests', () => {

  describe('configuration', () => {
    it('should be instantiable', () => {
        let wrapper = new xapi.Wrapper();
        expect(wrapper).to.exist;
    });
    it('should return a configuration object', () => {
        let wrapper = new xapi.Wrapper();
        let config = wrapper.getConfig();
        console.log('config',config);
        expect(config).to.exist;
    });
  });
});