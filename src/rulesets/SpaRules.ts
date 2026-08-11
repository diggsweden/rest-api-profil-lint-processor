// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';

const moduleName = 'SpaRules.js'

export class Spa04 extends BaseRuleset {
    static customProperties: CustomProperties = {
        område: 'Spårbarhet',
        id: 'SPA.04',
    };

    description = '-';
    message = 'API-producenten BÖR inkludera HTTP-headern traceparent i ett API-svar.';
    given = '$.paths[*][get,put,post,delete,patch].responses[*]';

    then = [
        {
            function: (targetVal: any, _opts: string, paths: string[]) => {
                const hasTraceparent = targetVal?.headers?.traceparent;

                if (hasTraceparent) {
                    return [];
                }

                return [
                    {
                        message: this.message,
                        severity: this.severity,
                        paths,
                    },
                ];
            },
        },
        {
            function: (targetVal: string, _opts: string, paths: string[]) => {
                this.trackRuleExecutionHandler(
                    JSON.stringify(targetVal, null, 2),
                    _opts,
                    paths,
                    this.severity,
                    this.constructor.name,
                    moduleName,
                    Spa04.customProperties,
                );
            },
        },
    ];

    constructor(context: RuleExecutionContext) {
        super(context);
        super.initializeFormats(['OAS3']);
    }

    severity = DiagnosticSeverity.Warning;

}

export default {
    Spa04
}
