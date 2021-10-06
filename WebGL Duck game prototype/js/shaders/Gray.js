THREE = THREE || {};
THREE.Extras = THREE.Extras || {};

THREE.Extras.Shaders = {

	Godrays: {
		uniforms: {
			tDiffuse: {type: "t", value:0, texture:null},
			fX: {type: "f", value: 0.55},
			fY: {type: "f", value: 0.55},
			fExposure: {type: "f", value: 0.36},
			fDecay: {type: "f", value: 0.9999},
			fDensity: {type: "f", value: 0.01},
			fWeight: {type: "f", value: 200.0},
			fClamp: {type: "f", value: 1.0}
		},

		vertexShader: [
			"varying vec2 vUv;",

			"void main() {",

				"vUv = uv;",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"
		].join("\n"),

		fragmentShader: [
			"varying vec2 vUv;",
			"uniform sampler2D tDiffuse;",

			"uniform float fX;",
			"uniform float fY;",
			"uniform float fExposure;",
			"uniform float fDecay;",
			"uniform float fDensity;",
			"uniform float fWeight;",
			"uniform float fClamp;",

			"const int iSamples = 4;",

			"void main()",
			"{",
				"vec2 deltaTextCoord = vec2(vUv - vec2(fX,fY));",
				"deltaTextCoord *= 1.0 /  float(iSamples) * fDensity;",
				"vec2 coord = vUv;",
				"float illuminationDecay = 0.004;",
				"vec4 FragColor = vec4(0.1);",

				"for(int i=0; i < iSamples ; i++)",
				"{",
					"coord += deltaTextCoord;",
					"vec4 texel = texture2D(tDiffuse, coord);",
					"texel *= illuminationDecay * fWeight;",

					"FragColor += texel;",

					"illuminationDecay *= fDecay;",
				"}",
				"FragColor *= fExposure;",
				"FragColor = clamp(FragColor, 0.0, fClamp);",
				"gl_FragColor = FragColor;",
			"}"
		].join("\n")
	},

	// Coeff'd additive buffer blending
	Additive: {
		uniforms: {
			tDiffuse: { type: "t", value: 0, texture: null },
			tAdd: { type: "t", value: 1, texture: null },
			fCoeff: { type: "f", value: 1.0 }
		},

		vertexShader: [
			"varying vec2 vUv;",

			"void main() {",

				"vUv = uv;",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"
		].join("\n"),

		fragmentShader: [
			"uniform sampler2D tDiffuse;",
			"uniform sampler2D tAdd;",
			"uniform float fCoeff;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 texel = texture2D( tDiffuse, vUv );",
				"vec4 add = texture2D( tAdd, vUv );",
				"gl_FragColor = texel + add * fCoeff;",

			"}"
		].join("\n")
	}
};