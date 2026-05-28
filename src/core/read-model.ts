export abstract class ReadModel<Props> {
  protected props: Props

  protected constructor(props: Props) {
    this.props = props
  }
}
