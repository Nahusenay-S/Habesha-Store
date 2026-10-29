import React from 'react';

const paths = {
  cart: <><path d="M3 4h2l2 11h10l2-8H6" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.3 3-5 7-5s6.3 1.7 7 5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></>,
  heart: <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
  edit: <><path d="m4 16.5-.8 4.3 4.3-.8L18 9.5 14.5 6 4 16.5Z" /><path d="m13 7.5 3.5 3.5M19 3a2 2 0 0 1 2 2c0 .6-.2 1-.6 1.4L19 7.8 15.5 4.3 16.9 2.9A2 2 0 0 1 19 3Z" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};

export default function Icon({ name, size = 18, strokeWidth = 1.7, title }) {
  return <svg aria-hidden={title ? undefined : true} aria-label={title} role={title ? 'img' : undefined} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
