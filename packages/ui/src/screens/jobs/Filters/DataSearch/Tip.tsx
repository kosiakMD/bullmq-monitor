import React from 'react';
import CloseableTip from '@/components/CloseableTip';
import { LinksConfig } from '@/config/links';

type TProps = {
  className?: string;
};
const DataSearchTip = ({ className }: TProps) => {
  const text = (
    <>
      <b>Job name</b> matches a case-insensitive substring, or a wildcard
      pattern like <code>send-*</code>. <b>Search in job data</b> is powered by{' '}
      <a target="_blank" rel="noreferrer" href="https://docs.jsonata.org/overview.html">
        jsonata
      </a>
      , see the{' '}
      <a target="_blank" rel="noreferrer" href={LinksConfig.searchExamples}>
        examples
      </a>
      . Both filters need a job status selected above.
    </>
  );
  return (
    <CloseableTip
      className={className}
      persistKey="jobs-filters-tip-v4"
      tip={text}
    />
  );
};
export default DataSearchTip;
