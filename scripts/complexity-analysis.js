
const plato = require('es6-plato');

// parse command line args
const optionDefinitions = [
    { name: 'src', type: String, defaultValue: './es6-src/**' },
    { name: 'output', type: String, defaultValue: './report' },
    { name: 'version', type: String, defaultValue: '2.0.0' },
    { name: 'commit', type: String, defaultValue: '' }
]
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions)

// close(ish) eslint config for ES6 + React
let lintRules = {
    extends: [
        'eslint:recommended',
        'plugin:react/recommended'
    ],
    plugins: [
        'react'
    ],
    env: {
        es6: true,
        browser: true,
        serviceworker: true
    },
    parserOptions: {
        'ecmaVersion': 6,
        'sourceType': 'module',
        'ecmaFeatures': {
            'jsx': true
        }
    },
    rules: {
        quotes: [2, 'double']
    }
};

// exclude all tests, toolbar/mockFactory and localization
let exclude = /\.test|registerToolbar|en-us|es-cl|mockFactory/;
let complexityRules = {};

let platoArgs = {
    title: `VoTT Complexity Analysis<br/>v${options.version}<br/>commit: ${options.commit}`,
    exclude: exclude,
    eslint: lintRules,
    complexity: complexityRules
};

console.info(`Running complexity analysis on \`${options.src}\`, writing results to \`${options.output}\`...`);
plato.inspect(options.src, options.output, platoArgs);
