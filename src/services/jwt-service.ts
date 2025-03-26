// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/example-access-control-migration
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {promisify} from 'util';
import {TokenService} from '@loopback/authentication';
import {BindingScope, inject, injectable, service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {repository} from '@loopback/repository';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {UserRepository} from '../repositories/user.repository';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

@injectable({scope: BindingScope.SINGLETON})
export class JWTService implements TokenService {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private jwtExpiresIn: string,
    @repository(UserRepository)
    public userRepository?: UserRepository,
  ) {}

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Forbidden('invalid_session');
    }

    let userProfile: UserProfile;

    try {
      // decode user profile from token
      const decodedToken = (await verifyAsync(token, this.jwtSecret)) || {};

      userProfile = Object.assign(
        {[securityId]: decodedToken.id, name: ''},
        {
          ...decodedToken,
        },
      );
    } catch (error) {
      throw new HttpErrors.Forbidden('invalid_session');
    }
    return userProfile;
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Forbidden(
        'Error generating token : userProfile is null',
      );
    }
    const userInfoForToken = {
      id: userProfile[securityId],
      ...userProfile,
    };
    // Generate a JSON Web Token
    let token: any;
    try {
      token = await signAsync(userInfoForToken, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Forbidden(`Error encoding token : ${error}`);
    }

    return token;
  }
}
