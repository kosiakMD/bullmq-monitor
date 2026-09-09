import React from 'react';
import { networkContextValue } from './value';

export const NetworkContext = React.createContext(networkContextValue);

export const NetworkProvider: React.FC<{ children?: React.ReactNode }> = (props) => {
  return (
    <NetworkContext.Provider value={networkContextValue}>
      {props.children}
    </NetworkContext.Provider>
  );
};
