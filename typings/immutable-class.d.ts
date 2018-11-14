// Generated by dts-bundle v0.2.0

declare module ImmutableClass {
  interface Equalable {
    equals(other: any): boolean;
  }

  export interface Base {
    /**
     * Checks to see if thing is an instance of the given constructor.
     * Works just like the native instanceof method but handles the case when
     * objects are coming from different frames or from different modules.
     * @param thing - the thing to test
     * @param constructor - the constructor class to check against
     * @returns {boolean}
     */
    isInstanceOf(thing: any, constructor: any): boolean;
    /**
     * Check to see if things are an array of instances of the given constructor
     * Uses isInstanceOf internally
     * @param things - the array of things to test
     * @param constructor - the constructor class to check against
     * @returns {boolean}
     */
    isArrayOf(things: any[], constructor: any): boolean;
    /**
     * Does a quick 'duck typing' test to see if the given parameter is a Higher Object
     * @param thing - the thing to test
     * @returns {boolean}
     */
    isImmutableClass(thing: any): boolean;
    /**
     * Checks if two general things are equal (if both null it counts as yes)
     * @param a - thing to compare
     * @param b - thing to compare
     * @returns {boolean}
     */
    generalEqual<T>(a: T, b: T): boolean;
    /**
     * Checks if two immutable classes are equal (if both null it counts as yes)
     * @param a - thing to compare
     * @param b - thing to compare
     * @returns {boolean}
     */
    immutableEqual<T extends Equalable>(a: T, b: T): boolean;
    /**
     * Checks is two arrays have equal higher objects
     * @param arrayA - array to compare
     * @param arrayB - array to compare
     * @returns {boolean}
     */
    immutableArraysEqual<T extends Equalable>(arrayA: T[], arrayB: T[]): boolean;
    /**
     * Checks if two lookups have equal immutable classes
     * @param lookupA - lookup to compare
     * @param lookupB - lookup to compare
     * @returns {boolean}
     */
    immutableLookupsEqual<T extends Equalable>(lookupA: { [k: string]: T }, lookupB: { [k: string]: T }): boolean;
  }
  export interface Instance<ValueType, JSType> {
    valueOf(): ValueType;
    toJS(): JSType;
    toJSON(): JSType;
    equals(other: Instance<ValueType, JSType>): boolean;
  }

  /**
   * Interface that the Higher Object class should conform to (types the class)
   */
  export interface Class<ValueType, JSType> {
    fromJS(properties: JSType): Instance<ValueType, JSType>;
    new (properties: ValueType): any;
  }
}

declare var ImmutableClass: ImmutableClass.Base;

declare module 'immutable-class' {
  export = ImmutableClass;
}