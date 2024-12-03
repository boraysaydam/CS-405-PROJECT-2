/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		
		// Task 2: Preparing normal buffers and setting up lighting for shaders

		// Create the normal buffer and associate it with the program
		this.normalBuffer = gl.createBuffer(); // Buffer creation remains the same
		if (this.normalBuffer) {
    		// Perform operations only if the buffer is valid
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); // Bind the normal buffer explicitly here
		}
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal'); // Obtain the location for the normal attribute

		// Retrieve and store the locations for various lighting properties
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos'); // Used to update light position dynamically
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting'); // Toggle for enabling or disabling lighting
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient'); // Location for ambient lighting control

		// Task 3: Configure specular lighting intensity
		// Using a slightly different approach for the uniform location
		this.specularLoc = (() => {
    		const loc = gl.getUniformLocation(this.prog, 'specular');
    		return loc;
		})(); // Inline function to retrieve and immediately assign the location

		// Task 4: Configure the blend factor
		// Blend factor is managed using a uniform variable controlled via HTML sliders
		this.blendFactorLoc = (() => {
    		const loc = gl.getUniformLocation(this.prog, 'blendFactor');
    		return loc;
		})(); // Use the same approach for blending factor uniform location

		// Reference previously initialized texture samplers
		// Avoid redundant re-initializations, which might already exist
		// this.sampler = gl.getUniformLocation(this.prog, 'tex');
		// this.sampler2 = gl.getUniformLocation(this.prog, 'tex2');

		// Use the shader program to ensure all configurations are applied
		if (this.prog) {
    		gl.useProgram(this.prog); // Safely use the program only if it is valid
		}
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		// Task 2: Update the normal coordinates for the buffer

		// Bind the normal buffer to the ARRAY_BUFFER target
		if (this.normalBuffer) {
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); // Ensure the buffer is valid before binding
		}

		// Transfer the normal coordinates data to the buffer
		const normalData = new Float32Array(normalCoords); // Create a typed array for the normal coordinates
		gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW); // Upload the data to the GPU for static use


	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */

		// Task 2: Bind the normal buffer and set up attribute pointers

		if (this.normalBuffer) {
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); // Bind the buffer for normal data
    		gl.enableVertexAttribArray(this.normalLoc); // Enable the attribute for the normal vector
    		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0); // Define how normal data is read
		}

		// Task 2 (and Task 3): Store the light position for shader use
		// Set the light position based on the light direction in the -z axis
		// The illumination is assumed to originate from the camera's perspective (z = 1.0)
		// The light direction is adjusted dynamically, not strictly parallel to the z-axis due to x and y variation
		const adjustedLightPos = [lightX, lightY, 1.0]; // Define the light position as an array
		gl.uniform3fv(this.lightPosLoc, adjustedLightPos); // Pass the array to the shader as a uniform

		// Task 4: Activate and bind textures for blending operations
		// Ensures both textures are properly bound for blending calculations
		gl.activeTexture(gl.TEXTURE0); // Set the first active texture unit
		gl.bindTexture(gl.TEXTURE_2D, this.texture); // Bind the first texture to TEXTURE0
		gl.activeTexture(gl.TEXTURE1); // Switch to the second active texture unit
		gl.bindTexture(gl.TEXTURE_2D, this.texture2); // Bind the second texture to TEXTURE1

		///////////////////////////////


		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {

			//console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			/**
			 * @Task1 : You should implement this part to accept non power of 2 sized textures
			 */

			//for task 1: I wrap horizontally and vertically and set minimizing and maximizing options for the texture.
			// Task 1: Configure texture wrapping and filtering options

			// Set the wrapping mode for horizontal (S-axis) and vertical (T-axis) directions
			const wrapMode = gl.CLAMP_TO_EDGE; // Define the wrapping mode as CLAMP_TO_EDGE
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode); // Apply wrapping mode for the S-axis
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode); // Apply wrapping mode for the T-axis

			// Define and set texture filtering options for minimizing and maximizing
			const filterMode = gl.LINEAR; // Use LINEAR filtering for smooth transitions
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode); // Apply filter for minification
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode); // Apply filter for magnification


		}

		gl.useProgram(this.prog);

		// Task 4: Reassign and prepare the texture for use in draw(trans)

		// Store the texture reference for future use
		if (texture) {
    		this.texture = texture; // Assign the texture if it is valid
		}

        
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	// Task 4: Define a method to configure and store the second texture for blending
	setSecondTexture(img) {
    	const secondTexture = gl.createTexture(); // Create a new texture object
    	gl.bindTexture(gl.TEXTURE_2D, secondTexture); // Bind the texture to the TEXTURE_2D target

    	// Define the texture image using the provided image object
    	gl.texImage2D(
        	gl.TEXTURE_2D,
        	0, // Mipmap level
        	gl.RGB, // Internal format
        	gl.RGB, // Format of the image data
        	gl.UNSIGNED_BYTE, // Data type
        	img // Image object
    	);

    	// Configure texture parameters based on power-of-2 dimensions
    	const isPowerOfTwo = (dim) => (dim & (dim - 1)) === 0; // Inline utility to check power-of-2
    	if (isPowerOfTwo(img.width) && isPowerOfTwo(img.height)) {
        	gl.generateMipmap(gl.TEXTURE_2D); // Generate mipmaps for power-of-2 textures
    	} else {
        	// Set texture wrapping and filtering for non-power-of-2 textures
        	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    	}

    	// Activate the shader program to configure the texture
    	gl.useProgram(this.prog);

    	// Store the texture and initialize blending
    	this.texture2 = secondTexture; // Store the created texture
    	this.setBlendFactor(0.5); // Default blending factor for immediate effect

    	// Bind the texture to TEXTURE1 for blending calculations
    	gl.activeTexture(gl.TEXTURE1);
    	gl.bindTexture(gl.TEXTURE_2D, secondTexture);

    	// Link the texture to the shader sampler
    	const samplerLocation = gl.getUniformLocation(this.prog, 'tex2'); // Get the sampler location
    	gl.uniform1i(samplerLocation, 1); // Associate the texture with TEXTURE1
}

// Task 4: Define a method to adjust the blending factor between textures
// The blend factor determines the visibility ratio of the two textures:
// 0.0 - Fully show the first texture
// 1.0 - Fully show the second texture
// Intermediate values blend the textures proportionally
setBlendFactor(factor) {
    gl.useProgram(this.prog); // Ensure the shader program is active
    gl.uniform1f(this.blendFactorLoc, factor); // Update the blending factor in the shader
}


	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		//console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */

		// Ensure the shader program is active
		gl.useProgram(this.prog);

		// Configure lighting based on the 'show' parameter
		if (show) {
    		gl.uniform1i(this.enableLightingLoc, 1); // Enable lighting in the shader

    		// Set default lighting parameters for ambient and specular components
    		const defaultAmbient = 0.50; // Default ambient light intensity
    		const defaultSpecular = 50.0; // Default specular light intensity
    		this.setAmbientLight(defaultAmbient); // Apply the default ambient light setting
    		this.setSpecularLight(defaultSpecular); // Apply the default specular light setting
		} else {
    		gl.uniform1i(this.enableLightingLoc, 0); // Disable lighting in the shader
		}	


	}
	
	setAmbientLight(ambient) {
		//console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */

		// Activate the shader program to set uniform variables
		if (this.prog) {
    		gl.useProgram(this.prog); // Ensure the program is valid and in use
		}

		// Update the ambient light intensity in the shader
		const ambientIntensity = ambient; // Assign the input ambient value to a constant
		gl.uniform1f(this.ambientLoc, ambientIntensity); // Pass the ambient intensity to the shader
	}

	// Task 3: Define a method to set the intensity of specular light
	setSpecularLight(specular) {
    	// Ensure the shader program is active
    	if (this.prog) {
        	gl.useProgram(this.prog); // Activate the program if valid
    	}

    	// Update the specular light intensity in the shader
    	const specularIntensity = specular; // Assign the input value to a local variable
    	gl.uniform1f(this.specularLoc, specularIntensity); // Pass the intensity to the uniform variable
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = mat3(mvp)*normal; 

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex;
			uniform vec3 color; 
			uniform vec3 lightPos;
			uniform float ambient;

			varying vec2 v_texCoord;
			varying vec3 v_normal;

			uniform float specular; 
			uniform float blendFactor; 
			uniform sampler2D tex2; 

			void main()
			{
				if (showTex && enableLighting) {
					vec4 texColor1 = texture2D(tex, v_texCoord);
					vec4 texColor2 = texture2D(tex2, v_texCoord);
					vec4 blendedTexture = (1.0 - blendFactor) * texColor1 + blendFactor * texColor2;

					vec3 lightColor = vec3(1.0, 1.0, 1.0);
					vec3 normal = normalize(v_normal);
					vec3 lightDir = normalize(-lightPos); 
					vec3 viewDir = vec3(0.0, 0.0, -1.0); 

					vec3 ambientLight = ambient * lightColor;

					float intensity = max(dot(normal, lightDir), 0.0);
					vec3 diffuseLight = intensity * lightColor;

					vec3 reflectDir = reflect(-lightDir, normal); // Compute reflection vector
					float spec = (intensity > 0.0) ? pow(max(dot(viewDir, reflectDir), 0.0), specular) : 0.0;
					vec3 specularLight = spec * lightColor;

					vec3 finalLighting = (ambientLight + diffuseLight + specularLight) * blendedTexture.rgb;
					gl_FragColor = vec4(finalLighting, blendedTexture.a);

				} else if (showTex) {
					vec4 texColor1 = texture2D(tex, v_texCoord);
					vec4 texColor2 = texture2D(tex2, v_texCoord);
					gl_FragColor = (1.0 - blendFactor) * texColor1 + blendFactor * texColor2;
				} else {
					gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				}
			}`;




// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////