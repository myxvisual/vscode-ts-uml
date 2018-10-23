const path = require('path')
const webpack = require('webpack')

const __DEV__ = process.env.NODE_ENV !== 'production'
const hostName = '127.0.0.1'
const port = 8092

module.exports = {
  entry: {
    app: [
      ...(__DEV__ ? [
        'react-hot-loader/patch',
        `webpack-hot-middleware/client?path=http://${hostName}:${port}/__webpack_hmr&hot=true&reload=false`,
        'webpack/hot/only-dev-server'
      ] : []),
      './src/WebView/index.tsx'
    ]
  },
  output: {
    path: path.resolve('./build'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js'
  },
  resolve: {
    extensions: ['.webpack.js', '.js', '.jsx', '.ts', '.tsx'],
    modules: ['./node_modules', './src'],
    alias: {
      '@root': path.resolve(__dirname, './src')
    }
  },
  resolveLoader: {
    moduleExtensions: ['-loader']
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: {
        loader: 'awesome-typescript',
        query: {
          configFileName: path.resolve(__dirname, './tsconfig.json')
        }
      }
    }]
  },
  devServer: {
    compress: true,
    hot: true,
    noInfo: true,
    port
  },
  optimization: {
    splitChunks: {
        cacheGroups: {
            default: false,
            vendors: false,

            vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                priority: 20
            },

            common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                enforce: true
            }
        }
    }
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    })
  ]
}
