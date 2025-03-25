import { BindingScope, Getter, injectable } from "@loopback/core";
import { repository } from "@loopback/repository";
import { UserRepository } from "../repositories/user.repository";
import { UserCredentialRepository } from "../repositories/user-credential.repository";
import { HttpErrors } from "@loopback/rest";
import bcrypt from "bcrypt";
import { Validation } from "../lib/validation";
import jwt from "jsonwebtoken";
import { pick } from "lodash";

@injectable({scope: BindingScope.SINGLETON})
export class AuthenticationService {
  private readonly saltRounds = 11;
  constructor(
    @repository.getter(UserRepository) 
    private userReposiptoryGetter: Getter<UserRepository>,
    @repository.getter(UserCredentialRepository) 
    private userCredentialRepositoryGetter: Getter<UserCredentialRepository>
  ){}

  async registerUser(data: {fullName: string, email: string, password: string}) {
    const {email, fullName, password} = data;

    const isEmailValid = Validation.emailValidation(email);
    if (!isEmailValid) throw HttpErrors.BadRequest("emailInvalid");

    const [userRepo, userCredentialRepo] = await Promise.all([
      this.userReposiptoryGetter(),
      this.userCredentialRepositoryGetter()
    ])

    const user = await userRepo.create({
      email,
      fullName,
    })

    await userCredentialRepo.create({
      userId: user.id,
      password: this.hashPassword(password),
    })

    return user;
  }

  hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(this.saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  async loginByEmail(email: string, password: string) {
    const userRepo = await this.userReposiptoryGetter()

    const existUser = await userRepo.findOne({
      where: {
        email
      },
      include: [
        {
          relation: "credentials",
        }
      ]
    })

    if (!existUser) throw HttpErrors.BadRequest("emailNotFound");

    const hashedPassword = existUser.credentials.password;
    
    const isPasswordMatch = bcrypt.compareSync(password, hashedPassword);

    if (!isPasswordMatch) throw HttpErrors.BadRequest("credentialsInvalid");

    const accessToken = jwt.sign(pick(existUser, "fullName", "type", "firstName", "lastName"), process.env.JWT_SECRET_KEY as string, {
      expiresIn: 60 * 60 * 24 * 30 // 1 month
    })

    return {
      accessToken
    }
  }
}