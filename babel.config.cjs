module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    'babel-plugin-react-compiler',
    // Transform import.meta.env to process.env for Jest
    function importMetaEnvPlugin() {
      return {
        visitor: {
          MemberExpression(path) {
            // Transform import.meta.env.VITE_* to process.env.VITE_*
            if (
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta' &&
              path.node.property.name === 'env'
            ) {
              path.replaceWithSourceString('process.env');
            }
          },
        },
      };
    },
  ],
};
