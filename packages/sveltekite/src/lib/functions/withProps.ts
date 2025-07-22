export function withProps(Component: any, defaultProps: Record<string, any>) {
   return function ($$anchor: any, $$props: any) {
      const mergedProps = { ...defaultProps, ...$$props };
      return Component($$anchor, mergedProps);
   };
}
