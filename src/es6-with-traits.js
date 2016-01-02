class Base {}
const Trait = function(traitFunc) {
	traitFunc.__trait__ = true;
	let iface = getInterface(traitFunc);
	traitFunc.mimics = traitFunc.check = iface.mimics;

	return traitFunc;
};
const withTraits = function(baseClassOrFirstTrait, ...traits) {
	var baseClass = baseClassOrFirstTrait.__trait__ ? baseClassOrFirstTrait(Base) : baseClassOrFirstTrait;
	return traits.reduce((parentClass, trait) => trait(parentClass), baseClass);
}

const getInterface = function(trait) {
	var aClass = trait(Base);
	var instance = new aClass();
	var prototype = Object.getPrototypeOf(instance);
	var propertyNames = Object.keys(instance)
						.concat(Object.getOwnPropertyNames(prototype)
						.concat(Object.getOwnPropertySymbols(prototype)));

	var typeString = (x) => Object.prototype.toString.call(x);

	var propertiesRequiredByInterface = [];
	for (let name of propertyNames) {
		let property = instance[name];
		if(property !== aClass) {
			propertiesRequiredByInterface.push({name, type: typeString(property)});
		}
	}

	// Check if object mimics this interface (has all the properties required by the interface)
	var mimics = function(object) {
		return propertiesRequiredByInterface.every((p) => typeString(object[p.name]) === p.type);
	}

	return {
		mimics,
		check: mimics, // compatibility with methodical
	};
}


if (typeof module !== 'undefined') {
	module.exports = {
		Trait: Trait,
		withTraits: withTraits
	};
}

if (require.main === module) {
	class Animal {}
	let Flying = Trait(function(parentClass) {
		return class Flying extends parentClass {
			constructor(...args) {
				super(...args);
				this.wings = ["left wing", "right wing"];
			}
			fly() {
				console.log("flap flap with the " + this.wings.join(" and "));
			}
		};
	});
	let Walking = Trait(function(parentClass) {
		return class Walking extends parentClass {
			constructor(...args) {
				super(...args);
				this.legs = this.legs || []; // there must be legs, by default we don't know how many

				// Also to be researched (as an alternative to the above):
				// Legged.check(this);
			}
			walk() {
				console.log("walking on legs " + this.legs.join(" and "));
			}
		};
	});
	let Biped = Trait(function(parentClass) {
		return class Biped extends parentClass {
			constructor(...args) {
				super(...args);
				this.legs = ["left leg", "right leg"];
			}
		};
	});
	let Quadruped = Trait(function(parentClass) {
		return class Quadruped extends parentClass {
			constructor(...args) {
				super(...args);
				this.legs = ["front left leg", "front right leg", "rear left leg", "rear right leg"];
			}
		};
	});

	class Dog extends withTraits(Animal, Quadruped, Walking) {}
	class Bird extends withTraits(Animal, Biped, Walking, Flying) {}
	let dog = new Dog();
	console.log("dog.walk():");
	dog.walk();

	let bird = new Bird();
	console.log("bird.walk():");
	bird.walk();
	console.log("bird.fly():");
	bird.fly();

	console.log("Does a dog walk?", Walking.mimics(dog)); // => true
	console.log("Does a dog fly?", Flying.mimics(dog)); // => false
}
