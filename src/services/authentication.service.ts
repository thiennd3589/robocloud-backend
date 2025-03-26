import {BindingScope, Getter, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {UserRepository} from '../repositories/user.repository';
import {UserCredentialRepository} from '../repositories/user-credential.repository';
import {HttpErrors} from '@loopback/rest';
import bcrypt from 'bcrypt';
import {Validation} from '../lib/validation';
import jwt from 'jsonwebtoken';
import {pick} from 'lodash';
import {
  MyUserService,
  TokenServiceBindings,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {TokenService} from '@loopback/authentication';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AuthenticationUserService} from './authentication-user.service';

@injectable({scope: BindingScope.SINGLETON})
export class AuthenticationService {
  private readonly saltRounds = 11;
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: AuthenticationUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @repository.getter(UserRepository)
    private userReposiptoryGetter: Getter<UserRepository>,
    @repository.getter(UserCredentialRepository)
    private userCredentialRepositoryGetter: Getter<UserCredentialRepository>,
  ) {}

  async registerUser(data: {
    fullName: string;
    email: string;
    password: string;
  }) {
    const {email, fullName, password} = data;

    const isEmailValid = Validation.emailValidation(email);
    if (!isEmailValid) throw HttpErrors.BadRequest('emailInvalid');

    const [userRepo, userCredentialRepo] = await Promise.all([
      this.userReposiptoryGetter(),
      this.userCredentialRepositoryGetter(),
    ]);

    const user = await userRepo.create({
      email,
      fullName,
    });

    await userCredentialRepo.create({
      userId: user.id,
      password: this.hashPassword(password),
    });

    return user;
  }

  hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(this.saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  async loginByEmail(email: string, password: string) {
    const user = await this.userService.verifyCredentials({email, password});
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const accessToken = await this.jwtService.generateToken(userProfile);

    return {
      accessToken,
      currentUser: user,
    };
  }
}
