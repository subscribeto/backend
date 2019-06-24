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
	ECSError,
	ECSRequest,
	ECSRequestType,
	ECSResponse,
	ECSRoute,
	ECSRouter,
	ECSTypeValidator,
	ECSValidator
} from "@elijahjcobb/server";
import * as Express from "express";
import { SessionValidator } from "../session/SessionValidator";
import { StandardType, OptionalType } from "typit";
import { Session } from "../session/Session";
import { Product } from "../objects/Product";
import { Files } from "../files/Files";
import {ECSQLQuery} from "@elijahjcobb/nosql";

export class ProductRouter extends ECSRouter {

	public async handleCreate(req: ECSRequest): Promise<ECSResponse> {

		const session: Session = req.getSession();
		const businessId: string = session.props.businessId as string;
		const name: string = req.get("name");
		const description: string = req.get("description");
		const image: string | undefined = req.get("image");

		let product: Product = new Product();
		product.props.businessId = businessId;
		product.props.name = name;
		product.props.description = description;
		await product.create();

		if (image) {

			let imageData: Buffer;

			try { imageData = Buffer.from("base64"); } catch (e) {

				throw ECSError
					.init()
					.msg("An image was passed however it was not encoded with base64 encoding.")
					.code(400)
					.show();

			}

			Files.saveFile(product, imageData);

		}

		return new ECSResponse(product.getJSON());

	}

	public async handleGet(req: ECSRequest): Promise<ECSResponse> {

		const id: string = req.getParameters().get("id") as string;
		const product: Product = await ECSQLQuery.getObjectWithId(Product, id);

		return new ECSResponse(product.getJSON());

	}

	public getRouter(): Express.Router {

		this.add(new ECSRoute(
			ECSRequestType.POST,
			"/",
			this.handleCreate,
			new ECSValidator(
				new ECSTypeValidator({
					name: StandardType.STRING,
					description: StandardType.STRING,
					image: new OptionalType(StandardType.STRING)
				}),
				SessionValidator
					.init()
					.business()
			)
		));

		this.add(new ECSRoute(
			ECSRequestType.GET,
			"/:id",
			this.handleGet
		));

		return this.createRouter();

	}

}