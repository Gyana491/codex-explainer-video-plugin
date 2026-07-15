type SaveOptions = {
	folder: string;
	filename?: string;
	extension: string;
	contentType: string;
};

export async function saveToR2(env: Env, response: Response, options: SaveOptions) {
	const bytes = await response.arrayBuffer();
	const name = sanitizeFilename(options.filename || crypto.randomUUID());
	const key = `${options.folder}/${name}.${options.extension}`;

	await env.MEDIA_BUCKET.put(key, bytes, {
		httpMetadata: {
			contentType: options.contentType,
			cacheControl: "public, max-age=31536000, immutable",
		},
	});

	return {
		key,
		url: `${env.PUBLIC_MEDIA_BASE_URL.replace(/\/+$/, "")}/${key}`,
		contentType: options.contentType,
		bytes: bytes.byteLength,
	};
}

function sanitizeFilename(value: string): string {
	return (
		value
			.trim()
			.toLowerCase()
			.replace(/\.[a-z0-9]+$/i, "")
			.replace(/[^a-z0-9-_]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 80) || crypto.randomUUID()
	);
}
