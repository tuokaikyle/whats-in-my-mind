/** @jsxImportSource react */
import { render } from '@react-email/render';
import { Button, Container, Heading, Hr, Link, Text } from '@react-email/components';

export function VerifyEmail({ url }: { url: string }) {
  return (
    <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '24px' }}>
      <Heading style={{ marginBottom: '24px' }}>Verify your email</Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px' }}>
        Confirm your email address to finish signing up for What's in My Mind.
      </Text>
      <Button
        href={url}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
        }}
      >
        Verify email
      </Button>
      <Hr style={{ margin: '24px 0', borderColor: '#eee' }} />
      <Text style={{ fontSize: '12px', color: '#666' }}>
        If the button above doesn't work, paste this link into your browser:{' '}
        <Link href={url} style={{ color: '#666' }}>
          {url}
        </Link>
      </Text>
      <Text style={{ fontSize: '12px', color: '#666' }}>
        If you didn't create an account, you can safely ignore this email.
      </Text>
    </Container>
  );
}

export async function renderVerifyEmail(url: string): Promise<string> {
  return render(<VerifyEmail url={url} />);
}
