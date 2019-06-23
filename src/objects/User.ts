/**
 *
 * Elijah Cobb
 * elijah@elijahcobb.com
 * https://elijahcobb.com
 *
 *
 * Copyright 2019 Elijah Cobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import {
	ECSQLFilter,
	ECSQLObject,
	ECSQLOperator,
	ECSQLQuery
} from "@elijahjcobb/nosql";
import { ECErrorOriginType, ECErrorStack, ECErrorType } from "@elijahjcobb/error";
import { ECGenerator, ECHash } from "@elijahjcobb/encryption";
import { Session } from "../session/Session";

export enum UserGender {
	Male,
	Female,
	Other
}

export interface TestUser {
	firstName: string;
}

export interface UserProps extends TestUser {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	gender: UserGender;
	birthday: string;
	salt: Buffer;
	pepper: Buffer;
}

export class User extends ECSQLObject<UserProps> {

	public constructor() {

		super("user", {
			firstName: "string",
			lastName: "string",
			email: "string",
			phone: "string",
			gender: "number",
			birthday: "string",
			salt: "buffer",
			pepper: "buffer"
		});

	}

	public getJSON(): object {

		return this.getFilteredJSON(
			"id",
			"email",
			"firstName",
			"lastName",
			"phone",
			"gender",
			"birthday",
			"updatedAt",
			"createdAt"
		);

	}

	public async getNewSession(): Promise<Session> {

		if (!this.id) throw Error("You cannot make a session for a user that has not been created.");

		console.log(`Ok so the user has the id: ${this.id}`);

		let session: Session = new Session();
		session.props.userId = this.id;

		console.log(`Ok so session.props.userId = ${session.props.userId}`);

		await session.create();

		console.log(`toit toit so session has id: ${session.id}`);

		return session;

	}

	private static createPepper(salt: Buffer, password: string): Buffer {

		let pepper: Buffer = Buffer.from(password, "utf8");
		for (let i: number = 0; i < 1000; i++) pepper = ECHash.hash(Buffer.concat([pepper, salt]));

		return pepper;

	}

	public static async doesUserExistForEmail(email: string): Promise<boolean> {

		const query: ECSQLQuery<User, UserProps> = new ECSQLQuery(User, new ECSQLFilter(
			"email",
			ECSQLOperator.Equal,
			email
		));

		return query.exists();

	}

	public static async signUp(email: string, password: string): Promise<User> {

		if (await this.doesUserExistForEmail(email)) {
			throw ECErrorStack.newWithMessageAndType(
				ECErrorOriginType.User,
				ECErrorType.ValueAlreadyExists,
				new Error("A user already exits with this email address."));
		}

		let user: User = new User();
		user.props.email = email;

		user.props.salt = ECGenerator.randomBytes(32);
		user.props.pepper = this.createPepper(user.props.salt, password);
		user.props.gender = UserGender.Other;

		await user.create();

		return user;

	}

	public static async signIn(email: string, password: string): Promise<User> {

		if (!await this.doesUserExistForEmail(email)) {
			throw ECErrorStack.newWithMessageAndType(
				ECErrorOriginType.User,
				ECErrorType.UsernameIncorrect,
				new Error("A user does not exist for this email address."));
		}

		let query: ECSQLQuery<User, UserProps> = new ECSQLQuery(User, new ECSQLFilter("email", ECSQLOperator.Equal, email));
		query.setLimit(1);
		let user: User = await query.getFirstObject();

		const pepperProvided: Buffer = this.createPepper(user.props.salt as Buffer, password);
		if (!(user.props.pepper as Buffer).equals(pepperProvided)) {

			throw ECErrorStack.newWithMessageAndType(
				ECErrorOriginType.User,
				ECErrorType.PasswordIncorrect,
				new Error("Password is incorrect for user."));

		}

		return user;

	}
}