'use strict';

const _ = require('lodash');

/**
 * serverless.yml 上に custom.stageVariables が設定されている場合、stage variablesとして設定します。
 *
 * 既に存在するステージに対して実行した場合、
 * StageDescription cannot be specified when stage referenced by StageName already exists
 * とエラーになる。
 */
class StageVariables {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = 'aws';

    this.hooks = {
      'after:deploy:compileEvents': this.compileStageVariables.bind(this),
    };
  }

  compileStageVariables() {
    if (!this.serverless.service.provider.compiledCloudFormationTemplate.Resources) {
      throw new this.serverless.classes
        .Error('This plugin needs access to Resources section of the AWS CloudFormation template');
    }
    if (!this.serverless.service.custom || !this.serverless.service.custom.stageVariables) {
      this.serverless.cli.log('Not Found Stage Variables');
      return;
    }

    const stageVariables = {
      Variables : {}
    };
    _.forEach(this.serverless.service.custom.stageVariables, (val, key) => {
      stageVariables.Variables[key] = val;
    });
    stageVariables.StageName = this.options.stage;

    _.forEach(this.serverless.service.provider.compiledCloudFormationTemplate.Resources, (val, key) => {
      if (key.startsWith('ApiGatewayDeployment')) {
        if (!val.Properties.StageDescription) {
          val.Properties.StageDescription = stageVariables;
        }
      }
    });
  }
};

module.exports = StageVariables;
