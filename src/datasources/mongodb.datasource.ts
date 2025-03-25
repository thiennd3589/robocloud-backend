import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {AnyObject, juggler} from '@loopback/repository';

const config = {
  name: 'mongodb',
  connector: 'mongodb',
  url: "",
  host: '',
  port: 0,
  user: '',
  password: '',
  database: '',
  useNewUrlParser: true
};

function updateConfig(dsConfig: AnyObject) {
  if (process.env.MONGODB_CONNECTOR_URL) {
    dsConfig.url = process.env.MONGODB_CONNECTOR_URL;
  } else {
    dsConfig.database = process.env.MONGODB_DBNAME;
    dsConfig.host = process.env.MONGODB_SERVICE_HOST;
    dsConfig.port = process.env.MONGODB_SERVICE_PORT;
    dsConfig.user = process.env.MONGODB_SERVICE_USERNAME;
    dsConfig.password = process.env.MONGODB_SERVICE_PASSWORD;
    dsConfig.protocol = process.env.MONGODB_SERVICE_PROTOCOL;
  }
  return dsConfig;
}

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongodbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'mongodb';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongodb', {optional: true})
    dsConfig: object = config,
  ) {
    super(updateConfig(dsConfig));
  }

  stop(): void | PromiseLike<void> {
    return super.disconnect();
  }
}
