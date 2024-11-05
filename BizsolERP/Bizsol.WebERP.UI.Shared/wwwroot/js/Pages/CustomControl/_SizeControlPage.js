import { SizeControlService } from '../../JSServices/_SizeControlService.js'

class Observable {
    constructor(subscribe) {
        this._subscribe = subscribe;
    }
    // Subscribe to the observable
    subscribe(observer) {
        return this._subscribe(observer);
    }
    // Create an observable from an array
    static fromArray(array) {
        return new Observable(observer => {
            array.forEach(item => observer.next(item));
            observer.complete();
        });
    }
}
// Example usage
const observable = new Observable(observer => {
    // Emit some values
    observer.next(SizeControlService.GetItemSizeMasterList("GP COIL"));
   // observer.next(2);
    //observer.next(3);
    // Emit an error
    // observer.error('Something went wrong');
    // Complete the observable
    observer.complete();
    // Cleanup function (optional)
    return () => {
        console.log('Observer unsubscribed');
    };
});


function ME() {
   // console.log(SizeControlService.GetItemSizeMasterList("GLASSINE"))
    //console.log(SizeControlService.GetItemSizeMasterList("GP COIL"))
    //console.log()
    SizeControlService.GetItemSizeMasterList("GP COIL").then(function (value) { console.log(value) })

    // Subscribe to the observable
    //const subscription = observable.subscribe({
    //    next: value => console.log('Received:', value),
    //    error: err => console.error('Error occurred:', err),
    //    complete: () => console.log('Observable completed')
    //});
    // Unsubscribe (cleanup)
    //subscription.unsubscribe();
}

window.ME = ME;




