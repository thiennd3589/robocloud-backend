import {AuthenticationComponent} from '@loopback/authentication';
import {JWTAuthenticationComponent} from '@loopback/authentication-jwt';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import http from 'http';
import {SocketIoServer} from './socket/socket.server';

// import {WebsocketControllerBooter} from './socket/socket.booter';

export {ApplicationConfig};

export class RobocloudBackendApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  private httpServer: http.Server;
  private socketIoServer: SocketIoServer;
  constructor(options: any = {}) {
    options.rest = options.rest || {};
    options.rest.basePath = '/api';
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    //Socket io config
    this.httpServer = http.createServer(this.requestHandler);
    this.socketIoServer = new SocketIoServer(this, this.httpServer);
    this.bind('servers.http.server').to(this.httpServer);

    // this.booters(WebsocketControllerBooter);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
      websocketControllers: {
        dirs: ['controllers'],
        extensions: ['.controller.ws.js'],
        nested: true,
      },
      repositories: {
        dirs: ['repositories'],
        extensions: ['.repository.js'],
        nested: true,
      },
      services: {
        services: {
          dirs: ['services'],
          extensions: ['.service.js'],
          nested: true,
        },
      },
    };
  }

  //eslint-disable-next-line
  //@ts-ignore
  async start() {
    // this.basePath('/api');
    await super.start();
    await this.socketIoServer.start();
  }

  //eslint-disable-next-line
  //@ts-ignore
  async stop() {
    await this.socketIoServer.stop();
    await super.stop();
  }
}
