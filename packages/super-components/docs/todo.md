# Super Components Todo

- [ ] provide optional error component arg in constructor
- [ ] improve error checking for props to make optional chaining unnecessary
- [ ] check that prop keys have associated query when instantiating super component

These two can probably be tackled together, in that while checking the prop keys and queries we could set up a system that checks if all required props are present before loading the component.

So we could save the data and errors to the instance as simple arrays of string keys, and then check against this when getting a component. If the props aren't available for that component, we could return either nothing, the error component or a specialised error component for that prop key.
