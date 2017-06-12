/// <reference types="mocha" />
/// <reference types="chai" />

import { DeciderCombinator } from '../src/Combinator2';
import { SignalValueProvider } from '../src/interfaces/SignalValueProvider';
import { SignalType } from '../src/interfaces/SignalType';
import { SignalID } from '../src/interfaces/SignalID';

import { expect } from 'chai';
import * as _ from 'lodash';

describe ('DeciderCombinator', () => {
    let dc: DeciderCombinator;

    let svp1: SignalValueProvider;
    let svp2: SignalValueProvider;

    const sigA: SignalID = { type: SignalType.virtual, name: 'a' };
    const sigB: SignalID = { type: SignalType.virtual, name: 'b' };
    const sigC: SignalID = { type: SignalType.virtual, name: 'c' };
    const sigD: SignalID = { type: SignalType.virtual, name: 'd' };
    const sigE: SignalID = { type: SignalType.virtual, name: 'e' };
    const sigF: SignalID = { type: SignalType.virtual, name: 'f' };

    beforeEach( () => {
        dc = new DeciderCombinator();

        svp1 = {
            signals: [
                { signal: sigA, count: -1 },
                { signal: sigB, count: 1 },
                { signal: sigC, count: 2 },
                { signal: sigD, count: 3 },
                { signal: sigE, count: 4 },
                { signal: sigF, count: 2 },
            ],
        };

        svp2 = {
            signals: [
                { signal: sigB, count: -1 },
                { signal: sigF, count: 2 },
            ],
        };

        dc.connections.push(svp1, svp2);

        dc.control_behavior.first_signal = sigC;
        dc.control_behavior.second_signal = sigB;
        dc.control_behavior.output_signal = sigA;
        dc.control_behavior.comparator = '>';
        dc.control_behavior.copy_count_from_input = true;
    });

    it('Should return an empty result if any of its settings are empty or is otherwise not initialized', () => {
        // left hand missing
        dc.control_behavior.first_signal = undefined;

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // right hand missing (no secon_signal or constant)
        dc.control_behavior.first_signal = sigC;
        dc.control_behavior.second_signal = undefined;

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // output missing
        dc.control_behavior.second_signal = sigB;
        dc.control_behavior.output_signal = undefined;

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // comparator missing
        dc.control_behavior.output_signal = sigA;
        dc.control_behavior.comparator = undefined;

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // copy_count.... missing
        dc.control_behavior.comparator = '>';
        dc.control_behavior.copy_count_from_input = undefined;

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // missing control_behavior
        dc.control_behavior = undefined;

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // brand new state
        dc = new DeciderCombinator();

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);
    });

    it('Should return an empty result if any of its settings are invalid', () => {
        // "signal-everything" cannot be a second_signal
        dc.control_behavior.second_signal = { type: SignalType.virtual, name: 'signal-everything' };

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // "signal-anything" cannot be a second_signal
        dc.control_behavior.second_signal = { type: SignalType.virtual, name: 'signal-anything' };

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // "signal-each" cannot be a second_signal
        dc.control_behavior.second_signal = { type: SignalType.virtual, name: 'signal-each' };

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // install valid second signal so we can proceed
        dc.control_behavior.second_signal = sigA;

        // "signal-anything" cannot be an output_signal
        dc.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-anything' };

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);

        // "signal-each" cannot be an output_signal if first_signal is not 'signal-each'
        dc.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-each' };

        dc.tick();
        dc.tock();

        expect(dc.valid).to.be.false;
        expect(dc.signals).to.have.lengthOf(0);
    });

    it('Should correctly perform all of its comparison operations', () => {
        // lt
        dc.control_behavior.first_signal = sigA;
        dc.control_behavior.comparator = '<';
        dc.control_behavior.second_signal = sigB;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        // lte
        dc.control_behavior.first_signal = sigE;
        dc.control_behavior.comparator = '≤';
        dc.control_behavior.second_signal = sigF;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        // gt
        dc.control_behavior.first_signal = sigC;
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigB;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        // gte
        dc.control_behavior.first_signal = sigE;
        dc.control_behavior.comparator = '≥';
        dc.control_behavior.second_signal = sigF;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        // eq
        dc.control_behavior.first_signal = sigE;
        dc.control_behavior.comparator = '=';
        dc.control_behavior.second_signal = sigF;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        // neq
        dc.control_behavior.first_signal = sigD;
        dc.control_behavior.comparator = '≠';
        dc.control_behavior.second_signal = sigE;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);
    });

    it('Should treat signals that don\'t exist as if they have a value of 0', () => {
        // second signal
        dc.control_behavior.first_signal = sigA;
        dc.control_behavior.comparator = '<';
        dc.control_behavior.second_signal = {
            type: SignalType.virtual,
            name: 'signal-new',
        };
        dc.control_behavior.output_signal = sigA;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        dc.control_behavior.comparator = '>';

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);

        // first signal
        dc.control_behavior.first_signal = {
            type: SignalType.virtual,
            name: 'signal-new',
        };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigA;
        dc.control_behavior.output_signal = sigA;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        dc.control_behavior.comparator = '<';

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);
    });

    it('Should remove signals with a value of 0 from the output', () => {
        dc.control_behavior.first_signal = sigA;
        dc.control_behavior.comparator = '<';
        dc.control_behavior.second_signal = sigC;
        dc.control_behavior.output_signal = sigB;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);
    });

    it('Should transform all outputs to 1 when copy_count_from_input = false and output_signal is not "signal-each"', () => {
        dc.control_behavior.first_signal = sigA;
        dc.control_behavior.comparator = '<';
        dc.control_behavior.second_signal = sigB;
        dc.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-everything' };
        dc.control_behavior.copy_count_from_input = false;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigA, count: 1 },
            { signal: sigC, count: 1 },
            { signal: sigD, count: 1 },
            { signal: sigE, count: 1 },
            { signal: sigF, count: 1 },
        ]);

        dc.control_behavior.output_signal = sigA;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigA, count: 1 },
        ]);
    });

    it('Should output 1 on the specified non-special output signal if copy_count_from_input is false, even if that signal didnt exist in the inputs', () => {
        dc.control_behavior.first_signal = sigD;
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigC;
        dc.control_behavior.copy_count_from_input = false;
        dc.control_behavior.output_signal = {
            type: SignalType.virtual,
            name: 'signal-new',
        };

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: {
                type: SignalType.virtual,
                name: 'signal-new',
            },
            count: 1,
        }]);
    });

    it('Should require everything to match if run with first_signal "signal-everything" ', () => {
        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-everything' };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = undefined;
        dc.control_behavior.constant = -2;
        dc.control_behavior.output_signal = sigA;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        dc.control_behavior.constant = 1;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);
    });

    it('Should match "signal-everything" even with an empty input set (because there is no input that makes the comparison false)', () => {
        svp1.signals = [];
        svp2.signals = [];

        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-everything' };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = undefined;
        dc.control_behavior.constant = 0;
        dc.control_behavior.copy_count_from_input = false;
        dc.control_behavior.output_signal = sigA;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: 1,
        }]);
    });

    it('Should match if even one input is true when run with first_signal "signal-anything" ', () => {
        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-anything' };
        dc.control_behavior.comparator = '<';
        dc.control_behavior.second_signal = undefined;
        dc.control_behavior.constant = 0;
        dc.control_behavior.output_signal = sigA;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([{
            signal: sigA,
            count: -1,
        }]);

        dc.control_behavior.constant = -2;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.have.lengthOf(0);
    });

    it('Should output all inputs on successful match when output_signal is "signal-everything"', () => {
        dc.control_behavior.first_signal = sigA;
        dc.control_behavior.comparator = '<';
        dc.control_behavior.second_signal = sigB;
        dc.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-everything' };

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigA, count: -1 },
            { signal: sigC, count: 2 },
            { signal: sigD, count: 3 },
            { signal: sigE, count: 4 },
            { signal: sigF, count: 4 },
        ]);
    });

    it('Should output only matching signals when run with first and output signals of "signal-each"', () => {
        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-each' };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigC;
        dc.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-each' };

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigD, count: 3 },
            { signal: sigE, count: 4 },
            { signal: sigF, count: 4 },
        ]);
    });

    it('Should output the sum of matching signals when run with first_signal of "signal-each" and a non-special output signal', () => {
        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-each' };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigC;
        dc.control_behavior.output_signal = sigB;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigB, count: 11 },
        ]);
    });

    it('Should output the number of matching signals when run with first_signal of "signal-each", a non-special output signal, and copy_count_from_input = false', () => {
        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-each' };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigC;
        dc.control_behavior.output_signal = sigB;
        dc.control_behavior.copy_count_from_input = false;

        dc.tick();
        dc.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigB, count: 3 },
        ]);
    });

    it('Should only change its output on tock() regardless of other setting changes', () => {
        let curSignals = _.cloneDeep(dc.signals);

        dc.tick();
        expect(dc.signals).to.deep.equal(curSignals);
        dc.tock();
        expect(dc.signals).to.deep.equal([{ signal: sigA, count: -1 }]);
        curSignals = _.cloneDeep(dc.signals);

        // pre tick changes
        // first_signal
        dc.control_behavior.first_signal = sigA;

        expect(dc.signals).to.deep.equal(curSignals);
        dc.tick();
        expect(dc.signals).to.deep.equal(curSignals);
        dc.tock();
        expect(dc.signals).to.deep.equal([]);
        curSignals = _.cloneDeep(dc.signals);

        // comparator
        dc.control_behavior.comparator = '<';

        expect(dc.signals).to.deep.equal(curSignals);
        dc.tick();
        expect(dc.signals).to.deep.equal(curSignals);
        dc.tock();
        expect(dc.signals).to.deep.equal([{ signal: sigA, count: -1 }]);
        curSignals = _.cloneDeep(dc.signals);

        // second_signal
        dc.control_behavior.second_signal = undefined;
        dc.control_behavior.constant = -2;

        expect(dc.signals).to.deep.equal(curSignals);
        dc.tick();
        expect(dc.signals).to.deep.equal(curSignals);
        dc.tock();
        expect(dc.signals).to.deep.equal([]);
        curSignals = _.cloneDeep(dc.signals);

        // output_signal
        dc.control_behavior.constant = 0;
        dc.tick();
        dc.tock();
        curSignals = _.cloneDeep(dc.signals);

        dc.control_behavior.output_signal = sigC;

        expect(dc.signals).to.deep.equal(curSignals);
        dc.tick();
        expect(dc.signals).to.deep.equal(curSignals);
        dc.tock();
        expect(dc.signals).to.deep.equal([{ signal: sigC, count: 2 }]);
        curSignals = _.cloneDeep(dc.signals);

        // copy_count_from_input
        dc.control_behavior.copy_count_from_input = false;

        expect(dc.signals).to.deep.equal(curSignals);
        dc.tick();
        expect(dc.signals).to.deep.equal(curSignals);
        dc.tock();
        expect(dc.signals).to.deep.equal([{ signal: sigC, count: 1 }]);
    });

    it('Should be chainable for fun and profit', () => {
        dc.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-each' };
        dc.control_behavior.comparator = '>';
        dc.control_behavior.second_signal = sigC;
        dc.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-each' };

        let dc2 = new DeciderCombinator();

        dc2.connections.push(dc);

        dc2.control_behavior.first_signal = { type: SignalType.virtual, name: 'signal-each' };
        dc2.control_behavior.comparator = '<';
        dc2.control_behavior.constant = 4;
        dc2.control_behavior.output_signal = { type: SignalType.virtual, name: 'signal-each' };
        dc2.control_behavior.copy_count_from_input = true;

        dc.tick();
        dc2.tick();

        dc.tock();
        dc2.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigD, count: 3 },
            { signal: sigE, count: 4 },
            { signal: sigF, count: 4 },
        ]);
        expect(dc2.signals).to.deep.equal([]);

        dc.tick();
        dc2.tick();

        dc.tock();
        dc2.tock();

        expect(dc.signals).to.deep.equal([
            { signal: sigD, count: 3 },
            { signal: sigE, count: 4 },
            { signal: sigF, count: 4 },
        ]);
        expect(dc2.signals).to.deep.equal([
            { signal: sigD, count: 3 },
        ]);
    });
});
