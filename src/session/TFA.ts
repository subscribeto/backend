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

import { ECGenerator } from "@elijahjcobb/encryption";
import {ECSError} from "@elijahjcobb/server";
import {Encryption} from "./Encryption";

export type TFATokenObject = { userId: string; code: string; };

export class TFAToken {

	public code: string;
	public userId: string;

	public constructor(userId: string) {

		this.userId = userId;
		this.code = ECGenerator.randomCode();

	}

	public encrypt(): string {

		const tokenObject: TFATokenObject = {
			code: this.code,
			userId: this.userId
		};

		try {

			const tokenString: string = JSON.stringify(tokenObject);
			const tokenData: Buffer = Buffer.from(tokenString, "utf8");
			const encryptedTokenData: Buffer = Encryption.encrypt(tokenData);
			return encryptedTokenData.toString("hex");

		} catch (e) {

			throw ECSError.init().msg("Failed to encrypt TFAToken.");

		}

	}

	public static decrypt(token: string): TFAToken {

		try {

			const encryptedTokenData: Buffer = Buffer.from(token, "hex");
			const decryptedTokenData: Buffer = Encryption.decrypt(encryptedTokenData);
			const tokenString: string = decryptedTokenData.toString("utf8");
			const tokenObject: TFATokenObject = JSON.parse(tokenString) as TFATokenObject;

			let newToken: TFAToken = new TFAToken(tokenObject.userId);
			newToken.code = tokenObject.code;

			return newToken;

		} catch (e) {

			throw ECSError.init().msg("Failed to decrypt TFAToken.");

		}

	}

}

export abstract class TFA {



}