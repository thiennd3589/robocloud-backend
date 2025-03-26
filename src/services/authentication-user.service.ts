import {UserService} from '@loopback/authentication';
import {User} from '../models/user.model';
import {UserCredential} from '../models/user-credential.model';
import {Getter} from '@loopback/core';
import {UserRepository} from '../repositories/user.repository';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import bcrypt from 'bcrypt';
import {omit} from 'lodash';
import {securityId, UserProfile} from '@loopback/security';

interface Credentials {
  email: string;
  password: string;
}

type UserWithoutCredentials = Omit<User, 'credentials'>;

export class AuthenticationUserService
  implements
    UserService<Omit<UserWithoutCredentials, 'credentials'>, Credentials>
{
  constructor(
    @repository.getter(UserRepository)
    private userReposiptoryGetter: Getter<UserRepository>,
  ) {
    this.userReposiptoryGetter = userReposiptoryGetter;
  }

  async verifyCredentials(
    credentials: Credentials,
  ): Promise<UserWithoutCredentials> {
    const {email, password} = credentials;
    const userRepo = await this.userReposiptoryGetter();
    // ensure the user exists, and the password is correct

    const existUser = await userRepo.findOne({
      where: {
        email,
      },
      include: [
        {
          relation: 'credentials',
        },
      ],
    });

    if (!existUser) throw HttpErrors.BadRequest('emailNotFound');

    const hashedPassword = existUser.credentials.password;

    const isPasswordMatch = bcrypt.compareSync(password, hashedPassword);

    if (!isPasswordMatch) throw HttpErrors.BadRequest('credentialsInvalid');

    return omit(existUser, 'credentials');
  }

  convertToUserProfile(
    user: Omit<UserWithoutCredentials, 'credentials'>,
  ): UserProfile {
    return {...user, [securityId]: user.id};
  }
}
