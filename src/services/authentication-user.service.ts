import {UserService} from '@loopback/authentication';
import {User} from '../models/user.model';
import {UserRepository} from '../repositories/user.repository';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import bcrypt from 'bcrypt';
import {securityId, UserProfile} from '@loopback/security';

interface Credentials {
  email: string;
  password: string;
}

export class AuthenticationUserService
  implements UserService<User, Credentials>
{
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const {email, password} = credentials;
    // ensure the user exists, and the password is correct

    const existUser = await this.userRepository.findOne({
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

    const hashedPassword = existUser.credentials?.password;

    if (!hashedPassword) throw HttpErrors.BadRequest('credentialsInvalid');

    const isPasswordMatch = bcrypt.compareSync(password, hashedPassword);

    if (!isPasswordMatch) throw HttpErrors.BadRequest('credentialsInvalid');

    delete existUser.credentials;
    return existUser;
  }

  convertToUserProfile(user: User): UserProfile {
    const userProfile = {
      ...user,
      [securityId]: user.id,
      fullName: user.fullName,
      type: user.type,
    };

    return userProfile;
  }
}
