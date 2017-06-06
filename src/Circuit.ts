import { Signal }               from './interfaces/Signal';
import { SignalValueProvider }  from './interfaces/SignalValueProvider';

export class Circuit {
    public providers: SignalValueProvider[];

    constructor() {
        this.providers = [];
    }

    public get signals(): Signal[] {
        let merged: Signal[] = [];

        // merge
        for (let provider of this.providers) {
            merged = merged.concat(provider.signals);
        }

        // get all unique signals contained in merged
        let deduped: Signal[] = merged.filter( (entry, i, arr) => {
            return i === arr.findIndex( (s) => {
                return s.signal.name === entry.signal.name;
            });
        });

        // collect and sum values for each unique signal
        let result: Signal[] = deduped.map( (unique): Signal => {
            let resultSignal: Signal = {
                signal: unique.signal,
                count: 0,
            };

            // find all input Signals with the uniqueSignal's name and accumulate their values
            resultSignal.count = merged.filter( (entry) => {
                return entry.signal.name === unique.signal.name;
            })
            .reduce( (acc, entry): number => {
                return acc + entry.count;
            }, 0);

            return resultSignal;
        });

        // return signals with a value !== 0
        return result.filter( (entry) => {
            return entry.count !== 0;
        });
    }
}