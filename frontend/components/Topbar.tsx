'use client';

import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopbarProps {
  breadcrumbs: BreadcrumbItem[];
  rightContent?: React.ReactNode;
}

export default function Topbar({ breadcrumbs, rightContent }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast) {
            return (
              <span key={index} className="current">
                {item.label}
              </span>
            );
          }

          return (
            <React.Fragment key={index}>
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
              <span className="sep">›</span>
            </React.Fragment>
          );
        })}
      </div>
      <div className="topbar-right">{rightContent}</div>
    </div>
  );
}
