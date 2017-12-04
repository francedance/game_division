const config = {
    production:{
        SECRET: process.env.SECRET,
        PORT: process.env.PORT,
        DATABASE: process.env.MONGODB_URI
    },
    default: {
        SECRET: 'SFDFSDI(*D(FDDF',
        DATABASE: 'mongodb://localhost:27017/tgd_app',
        PORT: 3000
    }
}

exports.get = function get(env){
    return config[env] || config.default
}