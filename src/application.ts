import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  TokenServiceBindings,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
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
import {AuthenticationUserService} from './services/authentication-user.service';
import {UserRepository} from './repositories/user.repository';
import {UserCredentialRepository} from './repositories/user-credential.repository';
import {JWTService} from './services/jwt-service';

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

    //JWT AUTHENTICATION SETUP
    this.bind(UserServiceBindings.USER_SERVICE).toClass(
      AuthenticationUserService as any,
    );
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to('604800'); //Expires in 7 days
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(
      process.env.JWT_SECRET_KEY || 'WEAK_SECRET',
    );

    // Bind user and credentials repository
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(UserRepository);
    this.bind(UserServiceBindings.USER_CREDENTIALS_REPOSITORY).toClass(
      UserCredentialRepository,
    ),
      // this.booters(WebsocketControllerBooter);

      (this.projectRoot = __dirname);
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
          extensions: ['.service.js', '.service.ts'],
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
