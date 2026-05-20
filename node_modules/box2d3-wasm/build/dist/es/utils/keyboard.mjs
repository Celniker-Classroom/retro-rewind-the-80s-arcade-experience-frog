const state = {
	initialized: false,
	down: {},
	pressed: {},
	touchControlElement: null,
};

class Keyboard {
	static Init() {
		console.assert(!state.initialized, 'Keyboard already initialized');
		window.addEventListener('keydown', Keyboard.keyDown);
		window.addEventListener('keyup', Keyboard.keyUp);
		state.initialized = true;
	}

	static Destroy() {
		window.removeEventListener('keydown', Keyboard.keyDown);
		window.removeEventListener('keyup', Keyboard.keyUp);

		state.down = {};
		state.pressed = {};
		state.initialized = false;
	}

	static getKey(key) {
		if(key === ' ') key = 'Space';
		return key;
	}

	static keyDown(event) {
		const key = Keyboard.getKey(event.key);
		if (!state.down[key]) {
			state.pressed[key] = true;
		}
		state.down[key] = true;
	}

	static keyUp(event) {
		const key = Keyboard.getKey(event.key);
		state.down[key] = false;
	}

	static IsDown(key) {
		key = Keyboard.getKey(key);
		return state.down[key];
	}

	static IsPressed(key) {
		key = Keyboard.getKey(key);
		return state.pressed[key];
	}

	static Update() {
		state.pressed = {};
	}

	static ShowTouchControls(keys) {
		Keyboard.HideTouchControls();

		const container = document.createElement('div');
		container.style.position = 'absolute';
		container.style.bottom = '50px';
		container.style.left = '50%';
		container.style.transform = 'translateX(-50%)';
		container.style.margin = '8px';
		container.style.padding = '8px';
		container.style.display = 'flex';
		container.style.borderRadius = '8px';
		container.style.justifyContent = 'center';
		container.style.alignItems = 'center';
		container.style.gap = '8px';
		container.style.backgroundColor = 'rgba(0,0,0,0.5)';
		container.style.zIndex = '1000';
		container.style.flexWrap = 'wrap';

		const size = 44;
		keys.forEach((key) => {
			const button = document.createElement('button');
			button.style.height = `${size}px`;
			button.style.fontSize = '24px';
			button.style.minWidth = `${size}px`;
			button.style.border = 'none';
			button.style.borderRadius = '6px';
			button.style.background = 'rgba(255,255,255,0.5)';
			button.style.cursor = 'pointer';
			button.style['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';
			button.style.userSelect = 'none';
			button.innerText = Keyboard.getKey(key);
			button.addEventListener('pointerdown', (event) => {
				event.preventDefault();
				state.down[Keyboard.getKey(key)] = true;
				state.pressed[Keyboard.getKey(key)] = true
				const keyup = () => {
					state.down[Keyboard.getKey(key)] = false;
					button.style.background = 'rgba(255,255,255,0.5)';
					window.removeEventListener('pointerup', keyup);
				};
				button.style.background = 'rgba(255,255,255,0.8)';
				window.addEventListener('pointerup', keyup);
				button.addEventListener('pointerleave', keyup);
			});
			container.appendChild(button);
		});

		document.body.appendChild(container);
		state.touchControlElement = container;
	}

	static HideTouchControls() {
		if (state.touchControlElement) {
			state.touchControlElement.remove();
			state.touchControlElement = null;
		}
	}
}

export default Keyboard;

export const Key = {
	Backspace: 'Backspace',
	Tab: 'Tab',
	Enter: 'Enter',
	Shift: 'Shift',
	Ctrl: 'Control',
	Alt: 'Alt',
	Pause: 'Pause',
	CapsLock: 'CapsLock',
	Escape: 'Escape',
	Space: ' ',
	PageUp: 'PageUp',
	PageDown: 'PageDown',
	End: 'End',
	Home: 'Home',
	ArrowLeft: 'ArrowLeft',
	ArrowUp: 'ArrowUp',
	ArrowRight: 'ArrowRight',
	ArrowDown: 'ArrowDown',
	PrintScreen: 'PrintScreen',
	Insert: 'Insert',
	Delete: 'Delete',
	Zero: '0',
	One: '1',
	Two: '2',
	Three: '3',
	Four: '4',
	Five: '5',
	Six: '6',
	Seven: '7',
	Eight: '8',
	Nine: '9',
	A: 'a',
	B: 'b',
	C: 'c',
	D: 'd',
	E: 'e',
	F: 'f',
	G: 'g',
	H: 'h',
	I: 'i',
	J: 'j',
	K: 'k',
	L: 'l',
	M: 'm',
	N: 'n',
	O: 'o',
	P: 'p',
	Q: 'q',
	R: 'r',
	S: 's',
	T: 't',
	U: 'u',
	V: 'v',
	W: 'w',
	X: 'x',
	Y: 'y',
	Z: 'z',
};
